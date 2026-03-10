import React from "react";
import Head from "next/head";
import { Container, Typography, Box } from "@mui/material";

const HelpPage = () => {
  return (
    <Container maxWidth="md">
      <Head>
        <title>Help - EquiViewer</title>
      </Head>
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Help & Support
        </Typography>
        <Typography variant="body1" paragraph>
          This is a placeholder for the Help page. Detailed instructions on how
          to use EquiViewer, author Audio Descriptions, structure DIY loops, and
          use Voice Control will be added here soon.
        </Typography>
      </Box>
    </Container>
  );
};

export default HelpPage;
