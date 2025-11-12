/**
 * CreatorLobby - Lobby view for room creator
 * 
 * Displays static room details (URL, code) and dynamic player list with polling.
 */

import { Suspense } from 'react';
import {
  Paper,
  Stack,
  Text,
  Group,
  CopyButton,
  ActionIcon,
  Tooltip,
  Badge,
  Divider,
  Button,
  Loader,
} from '@mantine/core';
import {
  IconCheck,
  IconLink,
} from '@tabler/icons-react';
import LobbyPlayers from './LobbyPlayers';

interface CreatorLobbyProps {
  roomCode: string;
  playerId: string;
  onCreateAnother: () => void;
}

export default function CreatorLobby({ 
  roomCode, 
  playerId,
  onCreateAnother 
}: CreatorLobbyProps) {
  const joinUrl = `${window.location.origin}/join/${roomCode}`;

  return (
    <Paper shadow="sm" p="xl" radius="md" withBorder>
      <Stack gap="lg">
        {/* Static Header - Never re-renders */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Text size="xl" fw={700}>Room Created!</Text>
            <Text size="sm" c="dimmed" mt={4}>
              Share the join URL with your friends
            </Text>
          </div>
          <Badge color="blue" size="lg" variant="filled">
            waiting
          </Badge>
        </Group>

        <Divider />

        {/* Static Join URL - Never re-renders */}
        <Stack gap="xs">
          <Text size="sm" fw={500} c="dimmed">
            Join URL
          </Text>
          <Group gap="xs">
            <Text
              size="sm"
              ff="monospace"
              style={{ 
                wordBreak: 'break-all',
                flex: 1
              }}
            >
              {joinUrl}
            </Text>
            <CopyButton value={joinUrl} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'URL Copied!' : 'Copy Join URL'} withArrow>
                  <ActionIcon
                    color={copied ? 'teal' : 'gray'}
                    variant="subtle"
                    onClick={copy}
                    size="lg"
                  >
                    {copied ? <IconCheck size={20} /> : <IconLink size={20} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
          <Text size="xs" c="dimmed">
            Room Code: <strong>{roomCode}</strong>
          </Text>
        </Stack>

        <Divider />

        {/* Dynamic Polling Section - Only this part re-renders */}
        <Suspense fallback={<Loader size="sm" />}>
          <LobbyPlayers 
            roomCode={roomCode} 
            playerId={playerId}
            pollInterval={2000}
          />
        </Suspense>

        <Divider />

        {/* Static Button - Never re-renders */}
        <Button
          variant="light"
          fullWidth
          onClick={onCreateAnother}
        >
          Create Another Room
        </Button>
      </Stack>
    </Paper>
  );
}

