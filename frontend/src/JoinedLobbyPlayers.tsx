/**
 * JoinedLobbyPlayers - Dynamic polling component for joined player view
 * 
 * Polls room state and automatically navigates to game when it starts.
 * Only this component re-renders during polling.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLazyLoadQuery, graphql } from 'react-relay';
import { Stack, Text, List, Badge, Group, Loader } from '@mantine/core';
import type { JoinedLobbyPlayersQuery } from './__generated__/JoinedLobbyPlayersQuery.graphql';

const ROOM_QUERY = graphql`
  query JoinedLobbyPlayersQuery($code: String!) {
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

interface JoinedLobbyPlayersProps {
  code: string;
  playerId: string;
  pollInterval?: number;
}

export default function JoinedLobbyPlayers({ 
  code, 
  playerId,
  pollInterval = 3000 
}: JoinedLobbyPlayersProps) {
  const navigate = useNavigate();
  const [pollKey, setPollKey] = useState(0);
  
  const data = useLazyLoadQuery<JoinedLobbyPlayersQuery>(
    ROOM_QUERY,
    { code },
    { fetchPolicy: 'network-only', fetchKey: pollKey }
  );
  
  // Poll for updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPollKey(prev => prev + 1);
    }, pollInterval);
    
    return () => clearInterval(interval);
  }, [code, pollInterval]);
  
  // Check if game started - navigate to game page
  useEffect(() => {
    if (data.roomByCode?.status === 'ACTIVE') {
      navigate(`/game/${code}`);
    }
  }, [data.roomByCode?.status, code, navigate]);
  
  if (!data.roomByCode) {
    return (
      <Text c="red" ta="center">
        Room no longer exists
      </Text>
    );
  }
  
  const room = data.roomByCode;
  const playerCount = room.players.length;
  
  return (
    <Stack gap="lg">
      <Stack gap="xs">
        <Text size="lg" fw={500}>
          Players ({playerCount}/4)
        </Text>
        <List spacing="sm">
          {room.players.map((player) => (
            <List.Item key={player.id}>
              <Group gap="xs">
                <Text>{player.nickname}</Text>
                {player.isCreator && (
                  <Badge ml="xs" size="sm" variant="light" color="blue">
                    Host
                  </Badge>
                )}
                {player.id === playerId && (
                  <Badge ml="xs" size="sm" variant="light" color="green">
                    You
                  </Badge>
                )}
              </Group>
            </List.Item>
          ))}
        </List>
      </Stack>
      
      <Text c="dimmed" ta="center">
        Waiting for host to start the game...
      </Text>
      
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Loader size="sm" />
      </div>
    </Stack>
  );
}

