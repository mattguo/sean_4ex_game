import type { FilmListQuery } from './__generated__/FilmListQuery.graphql';
import { graphql, useLazyLoadQuery } from 'react-relay';
import { Table, Title, Container, Paper } from '@mantine/core';
import React from 'react';

const FilmList: React.FC = () => {
  const data = useLazyLoadQuery<FilmListQuery>(
    graphql`
      query FilmListQuery {
        allFilms {
          films {
            id
            title
            director
          }
        }
      }
    `,
    {}
  );

  return (
    <Container size="lg" py="xl" w="100%">
      <Title order={1} mb="md" ta="center">
        Star Wars Films
      </Title>
      <Paper shadow="sm" p="md" radius="md">
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Title</Table.Th>
              <Table.Th>Director</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.allFilms?.films?.map(film => (
              <Table.Tr key={film?.id}>
                <Table.Td>{film?.title}</Table.Td>
                <Table.Td>{film?.director}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
    </Container>
  );
};

export default FilmList;
