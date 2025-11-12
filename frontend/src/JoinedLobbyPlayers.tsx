/**
 * JoinedLobbyPlayers - Dynamic polling component for joined player view
 * 
 * Polls room state and automatically navigates to game when it starts.
 * Only this component re-renders during polling.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { graphql, useRelayEnvironment } from 'react-relay';
import { fetchQuery } from 'relay-runtime';
import { isEqual } from 'lodash';
import { Stack, Text, List, Badge, Group } from '@mantine/core';
import type { JoinedLobbyPlayersQuery, JoinedLobbyPlayersQuery$data } from './__generated__/JoinedLobbyPlayersQuery.graphql';

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
  const environment = useRelayEnvironment();
  const [roomData, setRoomData] = useState<JoinedLobbyPlayersQuery$data | null>(null);
  const previousDataRef = useRef<JoinedLobbyPlayersQuery$data | null>(null);
  
  // Poll at specified interval and fetch data
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await fetchQuery<JoinedLobbyPlayersQuery>(
          environment,
          ROOM_QUERY,
          { code }
        ).toPromise();
        
        if (response) {
          // Only update state if data actually changed
          if (!isEqual(response, previousDataRef.current)) {
            previousDataRef.current = response;
            setRoomData(response);
          }
        }
      } catch (error) {
        console.error('Failed to fetch room data:', error);
      }
    };

    // Fetch immediately on mount
    fetchRoomData();
    
    // Then poll at specified interval
    const interval = setInterval(fetchRoomData, pollInterval);
    
    return () => clearInterval(interval);
  }, [environment, code, pollInterval]);
  
  // Check if game started - navigate to game page
  useEffect(() => {
    if (roomData?.roomByCode?.status === 'ACTIVE') {
      navigate(`/game/${code}`);
    }
  }, [roomData?.roomByCode?.status, code, navigate]);
  
  if (!roomData?.roomByCode) {
    return (
      <Text c="red" ta="center">
        Room no longer exists
      </Text>
    );
  }
  
  const room = roomData.roomByCode;
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
    </Stack>
  );
}

