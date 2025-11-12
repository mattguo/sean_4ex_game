/**
 * JoinedLobby - Waiting lobby for players who have joined a room
 * 
 * Displays static room information and dynamic player list with polling.
 */

import { Suspense } from 'react';
import { Container, Title, Text, Stack, Loader } from '@mantine/core';
import JoinedLobbyPlayers from './JoinedLobbyPlayers';

interface JoinedLobbyProps {
  code: string;
  playerId: string;
}

export default function JoinedLobby({ code, playerId }: JoinedLobbyProps) {
  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        {/* Static Header - Never re-renders */}
        <div>
          <Title order={1}>Waiting for Game to Start...</Title>
          <Text c="dimmed" mt="sm">
            Room Code: <strong>{code}</strong>
          </Text>
        </div>
        
        {/* Dynamic Polling Section - Only this part re-renders */}
        <Suspense fallback={<Loader size="sm" />}>
          <JoinedLobbyPlayers 
            code={code} 
            playerId={playerId}
            pollInterval={3000}
          />
        </Suspense>
      </Stack>
    </Container>
  );
}

