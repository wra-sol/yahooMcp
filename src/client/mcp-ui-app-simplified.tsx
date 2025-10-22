import React from 'react';
import { createRoot } from 'react-dom/client';

const App = () => {
  return <h1>Hello, World!</h1>;
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
