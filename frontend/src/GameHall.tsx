/**
 * GameHall Component
 * 
 * The main lobby interface where players can:
 * - Create a new game room
 * - View their current room details
 * - Copy room code to share with friends
 */

import { useState } from 'react';
import { useMutation, graphql } from 'react-relay';
import {
  Container,
  Title,
  Paper,
  Stack,
  TextInput,
  Button,
  Text,
  Group,
  CopyButton,
  ActionIcon,
  Tooltip,
  Alert,
  Badge,
  Divider,
} from '@mantine/core';
import {
  IconUserPlus,
  IconCopy,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react';
import type { GameHallCreateRoomMutation } from './__generated__/GameHallCreateRoomMutation.graphql';
import { validateNickname } from './utils/validation';

/**
 * GraphQL mutation to create a new room.
 */
const CREATE_ROOM_MUTATION = graphql`
  mutation GameHallCreateRoomMutation($nickname: String!) {
    createRoom(nickname: $nickname) {
      room {
        id
        code
        gameType
        status
        createdAt
      }
      player {
        id
        nickname
        isCreator
        joinedAt
      }
    }
  }
`;

/**
 * GameHall component that displays room creation and management interface.
 */
export default function GameHall() {
  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<
    GameHallCreateRoomMutation['response']['createRoom'] | null
  >(null);

  const [commitCreateRoom, isCreatingRoom] =
    useMutation<GameHallCreateRoomMutation>(CREATE_ROOM_MUTATION);

  /**
   * Handle nickname input change with validation.
   */
  const handleNicknameChange = (value: string) => {
    setNickname(value);
    // Clear error on input change
    if (nicknameError) {
      setNicknameError(null);
    }
  };

  /**
   * Handle room creation form submission.
   */
  const handleCreateRoom = () => {
    // Validate nickname
    const error = validateNickname(nickname);
    if (error) {
      setNicknameError(error);
      return;
    }

    // Submit mutation
    commitCreateRoom({
      variables: { nickname: nickname.trim() },
      onCompleted: (response) => {
        setRoomData(response.createRoom);
        setNickname(''); // Clear form
      },
      onError: (error) => {
        setNicknameError(error.message);
      },
    });
  };

  /**
   * Render room creation form.
   */
  const renderCreateForm = () => (
    <Paper shadow="sm" p="xl" radius="md" withBorder>
      <Stack gap="md">
        <Title order={2}>Create New Room</Title>
        <Text size="sm" c="dimmed">
          Enter your nickname to create a game room and invite friends.
        </Text>

        <TextInput
          label="Your Nickname"
          placeholder="Enter 3-20 characters"
          value={nickname}
          onChange={(e) => handleNicknameChange(e.currentTarget.value)}
          error={nicknameError}
          disabled={isCreatingRoom}
          leftSection={<IconUserPlus size={16} />}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isCreatingRoom) {
              handleCreateRoom();
            }
          }}
        />

        <Button
          onClick={handleCreateRoom}
          loading={isCreatingRoom}
          fullWidth
          size="lg"
        >
          Create Room
        </Button>
      </Stack>
    </Paper>
  );

  /**
   * Render room details after creation.
   */
  const renderRoomDetails = () => {
    if (!roomData) return null;

    const { room, player } = roomData;

    return (
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Stack gap="lg">
          <Group justify="space-between" align="flex-start">
            <div>
              <Title order={2}>Room Created!</Title>
              <Text size="sm" c="dimmed" mt={4}>
                Share the room code with your friends
              </Text>
            </div>
            <Badge color="blue" size="lg" variant="filled">
              {room.status.toUpperCase()}
            </Badge>
          </Group>

          <Divider />

          {/* Room Code Display */}
          <Stack gap="xs">
            <Text size="sm" fw={500} c="dimmed">
              Room Code
            </Text>
            <Group gap="xs">
              <Text
                size="xl"
                fw={700}
                ff="monospace"
                style={{ letterSpacing: '0.15em' }}
              >
                {room.code}
              </Text>
              <CopyButton value={room.code} timeout={2000}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? 'Copied!' : 'Copy code'} withArrow>
                    <ActionIcon
                      color={copied ? 'teal' : 'gray'}
                      variant="subtle"
                      onClick={copy}
                      size="lg"
                    >
                      {copied ? <IconCheck size={20} /> : <IconCopy size={20} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>
          </Stack>

          {/* Player Info */}
          <Stack gap="xs">
            <Text size="sm" fw={500} c="dimmed">
              Your Nickname
            </Text>
            <Group gap="xs">
              <Text size="md" fw={500}>
                {player.nickname}
              </Text>
              {player.isCreator && (
                <Badge color="yellow" size="sm">
                  Creator
                </Badge>
              )}
            </Group>
          </Stack>

          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Next Steps"
            color="blue"
            variant="light"
          >
            Share the room code with your friends so they can join. The game will
            start once all players are ready.
          </Alert>

          <Button
            variant="light"
            fullWidth
            onClick={() => setRoomData(null)}
          >
            Create Another Room
          </Button>
        </Stack>
      </Paper>
    );
  };

  return (
    <Container size="sm" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} ta="center">
            Sean 4EX Game Hall
          </Title>
          <Text size="lg" c="dimmed" ta="center" mt="sm">
            Create or join a game room to start playing
          </Text>
        </div>

        {roomData ? renderRoomDetails() : renderCreateForm()}
      </Stack>
    </Container>
  );
}

