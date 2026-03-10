import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import { supabase } from "../lib/supabase";

const LoginDialog = ({ open, onClose }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // You must set this to the deployed URL eventually, or localhost for dev.
          // Vercel auto-sets NEXT_PUBLIC_VERCEL_URL if configured, but let's keep it robust.
          emailRedirectTo:
            typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });

      if (error) throw error;
      setMessage("Check your email for the magic login link!");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Sign In to EquiViewer</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleLogin} sx={{ mt: 2 }}>
          <Typography variant="body1" paragraph>
            Sign in with a Magic Link to save your created Audio Descriptions,
            DIY steps, and TBMA scripts under your profile.
          </Typography>

          <TextField
            fullWidth
            type="email"
            label="Email Address"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading || Boolean(message)}
            sx={{ mb: 2 }}
          />

          {message && (
            <Typography color="success.main" variant="body2" sx={{ mb: 2 }}>
              {message}
            </Typography>
          )}

          {error && (
            <Typography color="error.main" variant="body2" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <DialogActions sx={{ px: 0, pb: 0 }}>
            <Button onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !email || Boolean(message)}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              Send Magic Link
            </Button>
          </DialogActions>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(LoginDialog);
