import React from "react";
import { Box, Typography, Link as MuiLink } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/router";

const Footer = () => {
  const router = useRouter();

  // Hide footer on specific embedded routes if desired
  if (router.query.embed === "true") return null;

  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        py: 3,
        px: 2,
        backgroundColor: "#f5f5f5",
        textAlign: "center",
        borderTop: "1px solid #e0e0e0",
      }}
    >
      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
        <MuiLink
          href="https://codea11y.dev/"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ mx: 1 }}
        >
          codea11y.dev
        </MuiLink>
        |
        <MuiLink
          href="https://buymeacoffee.com/danwestfalb"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ mx: 1 }}
        >
          Buy Me a Coffee
        </MuiLink>
      </Typography>

      <Typography variant="body2" color="textSecondary">
        <MuiLink component={Link} href="/help" sx={{ mx: 1 }}>
          Help
        </MuiLink>
        |
        <MuiLink component={Link} href="/about" sx={{ mx: 1 }}>
          About
        </MuiLink>
      </Typography>
    </Box>
  );
};

export default Footer;
