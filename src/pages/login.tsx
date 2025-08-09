import { signIn } from "next-auth/react";
import { Container, TextField, Button, Stack, Typography, Paper, Alert } from "@mui/material";
import { useState } from "react";
import Layout from "../components/Layout";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr]         = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const res = await signIn("credentials", { username, password, redirect: false, callbackUrl: "/" });
    if (res?.error) setErr("Sign in failed. Check your credentials.");
    else window.location.href = "/";
  };

  return (
    <Layout breadcrumb={<>Matrix › <b>Login</b></>}>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>Sign in</Typography>
          {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
          <form onSubmit={submit}>
            <Stack spacing={2}>
              <TextField label="Username" value={username} onChange={e=>setUsername(e.target.value)} />
              <TextField label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
              <Button variant="contained" type="submit">Login</Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Layout>
  );
}
(LoginPage as any).requireAuth = false; // public page
export default LoginPage;
