import React from "react";
import Head from "next/head";
import { Container, Typography, Box } from "@mui/material";

const AboutPage = () => {
  return (
    <Container maxWidth="md">
      <Head>
        <title>About - EquiViewer</title>
      </Head>
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          About EquiViewer
        </Typography>
        <Typography variant="body1" paragraph>
          This is a placeholder for the About Me page. Information about Daniel
          Westfall and the mission of EquiViewer and CodeA11y will be populated
          here tomorrow.
        </Typography>
      </Box>
    </Container>
  );
};

export default AboutPage;
