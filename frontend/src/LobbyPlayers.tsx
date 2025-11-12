/**
 * LobbyPlayers - Dynamic polling component for player list and game controls
 * 
 * This component polls the room state and only re-renders the player list
 * and start game button, keeping other UI elements stable.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useLazyLoadQuery, graphql } from 'react-relay';
import {
  Stack,
  Text,
  List,
  Badge,
  Button,
  Group,
  Tooltip,
  Alert,
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconAlertCircle,
} from '@tabler/icons-react';
import type { LobbyPlayersQuery } from './__generated__/LobbyPlayersQuery.graphql';
import type { LobbyPlayersStartGameMutation } from './__generated__/LobbyPlayersStartGameMutation.graphql';

const ROOM_QUERY = graphql`
  query LobbyPlayersQuery($code: String!) {
    roomByCode(code: $code) {
      id
      code
      status
      players {
        id
        nickname
        isCreator
        joinedAt
      }
    }
  }
`;

const START_GAME_MUTATION = graphql`
  mutation LobbyPlayersStartGameMutation($code: String!) {
    startGame(code: $code) {
      success
      error
      room {
        id
        code
        status
      }
    }
  }
`;

interface LobbyPlayersProps {
  roomCode: string;
  playerId: string;
  pollInterval?: number; // milliseconds, default 3000
}

export default function LobbyPlayers({ 
  roomCode, 
  playerId,
  pollInterval = 3000 
}: LobbyPlayersProps) {
  const navigate = useNavigate();
  const [pollKey, setPollKey] = useState(0);
  
  const [commitStartGame, isStartingGame] = 
    useMutation<LobbyPlayersStartGameMutation>(START_GAME_MUTATION);

  // Query room state for polling
  const data = useLazyLoadQuery<LobbyPlayersQuery>(
    ROOM_QUERY,
    { code: roomCode },
    { fetchPolicy: 'network-only', fetchKey: pollKey }
  );
  
  // Poll at specified interval
  useEffect(() => {
    const interval = setInterval(() => {
      setPollKey(prev => prev + 1);
    }, pollInterval);
    
    return () => clearInterval(interval);
  }, [roomCode, pollInterval]);
  
  const room = data.roomByCode;
  
  if (!room) {
    return (
      <Alert color="red" title="Room Not Found">
        This room no longer exists.
      </Alert>
    );
  }
  
  const playerCount = room.players.length;
  const canStartGame = playerCount >= 2 && playerCount <= 4;
  
  const handleStartGame = () => {
    commitStartGame({
      variables: { code: room.code },
      onCompleted: (response) => {
        if (response.startGame.success) {
          navigate(`/game/${room.code}`);
        }
      }
    });
  };

  return (
    <Stack gap="lg">
      {/* Players List */}
      <Stack gap="xs">
        <Text size="sm" fw={500} c="dimmed">
          Players ({playerCount}/4)
        </Text>
        <List spacing="xs">
          {room.players.map((p) => (
            <List.Item key={p.id}>
              <Group gap="xs">
                <Text size="sm">{p.nickname}</Text>
                {p.isCreator && (
                  <Badge color="yellow" size="sm">
                    Host
                  </Badge>
                )}
                {p.id === playerId && (
                  <Badge color="green" size="sm">
                    You
                  </Badge>
                )}
              </Group>
            </List.Item>
          ))}
        </List>
      </Stack>

      {/* Start Game Button */}
      <Tooltip
        label={
          playerCount < 2
            ? 'Need at least 2 players to start'
            : playerCount > 4
            ? 'Too many players (max 4)'
            : 'Start the game now'
        }
        disabled={canStartGame}
      >
        <Button
          leftSection={<IconPlayerPlay size={16} />}
          onClick={handleStartGame}
          disabled={!canStartGame}
          loading={isStartingGame}
          fullWidth
          color="green"
        >
          Start Game ({playerCount}/4 players)
        </Button>
      </Tooltip>

      <Alert
        icon={<IconAlertCircle size={16} />}
        title="Waiting for Players"
        color="blue"
        variant="light"
      >
        Share the join URL above with your friends. The game will start
        when you have 2-4 players and click "Start Game".
      </Alert>
    </Stack>
  );
}

