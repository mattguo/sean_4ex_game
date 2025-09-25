import { StrictMode, Suspense, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { RelayEnvironmentProvider } from 'react-relay';
import { Environment, Network, type FetchFunction } from 'relay-runtime';
import { MantineProvider, ActionIcon, Box } from '@mantine/core';
import '@mantine/core/styles.css';
import { IconMoon, IconSun } from '@tabler/icons-react';

const fetchGraphQL: FetchFunction = async (request, variables) => {
  const resp = await fetch('/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: request.text, variables }),
  });
  if (!resp.ok) {
    throw new Error('Response failed.');
  }
  return await resp.json();
};

const environment = new Environment({
  network: Network.create(fetchGraphQL),
});

// Detect browser default theme preference
const getSystemColorScheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return 'light'; // Default to light mode
};

// Theme toggle component
export function AppWithThemeToggle() {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(
    getSystemColorScheme()
  );

  return (
    <MantineProvider forceColorScheme={colorScheme}>
      <Box pos="relative" w="100%">
        <ActionIcon
          variant="transparent"
          aria-label="Settings"
          onClick={() =>
            setColorScheme(prev => (prev === 'light' ? 'dark' : 'light'))
          }
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1000,
          }}
        >
          {colorScheme === 'dark' ? (
            <IconSun stroke={2} />
          ) : (
            <IconMoon stroke={2} />
          )}
        </ActionIcon>

        <RelayEnvironmentProvider environment={environment}>
          <Suspense fallback="Loading...">
            <App />
          </Suspense>
        </RelayEnvironmentProvider>
      </Box>
    </MantineProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWithThemeToggle />
  </StrictMode>
);
