import React from 'react';
import { Alert, Typography } from '@mui/material';

const PortfolioNotice = ({ sx }) => (
  <Alert severity="info" sx={sx}>
    <Typography variant="body2" sx={{ fontWeight: 600 }}>
      Note: This is for my portfolio. The full production project runs on Wateen&apos;s IP address. I handled the backend APIs and the database migrations there.
    </Typography>
  </Alert>
);

export default PortfolioNotice;
