import { Client } from '@elastic/elasticsearch';
import fs from 'fs'; 

const client = new Client({
    node: 'https://localhost:9200',
    auth: {
      username: 'elastic',
      password: 'poL-cF9Z-jbW9E02-RWt'
    },
    tls: {
      ca: './http_ca.crt',
      rejectUnauthorized: false
    }
  });

  const response = await client.search({
    index: 'contract-events',
    body: {
      query: {
        match: {
          "address": "0x79b5Dc210F5D89469C1C233F2d7327c8f0f5b399",
        },
      },
    },
  });
  
  console.log(response.hits.hits);

  const res = await client.search({
    index: 'contract-events',
    body: {
      query: {
        term: {
          "blockNumber": 7255300,
        },
      },
    },
  });
  
  console.log(res);