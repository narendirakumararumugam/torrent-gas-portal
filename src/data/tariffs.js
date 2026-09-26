export const tariffSlabs = [
  {
    tier: '< 10,000 SCMD',
    pressure: 'Low Pressure Supply',
    rate: '₹46.25 / SCM',
    taxes: 'GST additional as applicable',
    penalty: 'MGQ shortfall penalty: ₹2.40 / SCM',
    note: 'Designed for medium industrial consumption with seasonal variance.',
  },
  {
    tier: '> 10,000 SCMD',
    pressure: 'Medium Pressure Supply',
    rate: '₹43.10 / SCM',
    taxes: 'GST additional as applicable',
    penalty: 'MGQ shortfall penalty: ₹1.95 / SCM',
    note: 'Preferred for continuous operations and higher sustained demand.',
  },
  {
    tier: 'On-Demand Peaking',
    pressure: 'High Pressure Supply',
    rate: '₹48.80 / SCM',
    taxes: 'GST additional as applicable',
    penalty: 'Emergency balancing surcharge may apply',
    note: 'Used when operational pressure and delivery assurance are critical.',
  },
];
