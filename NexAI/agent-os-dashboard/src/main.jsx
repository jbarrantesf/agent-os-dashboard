import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { QueryClient, QueryClientProvider } from 'react-query';
import Kanban from './Kanban';

const queryClient = new QueryClient();

ReactDOM.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Kanban />
    </QueryClientProvider>
  </React.StrictMode>,
  document.getElementById('root')
);