import React, { useState } from 'react';
import { useQuery } from 'react-query';
import Board from 'react-trello';

const Kanban = () => {
  const { data, error, isLoading } = useQuery('fetchTasks', fetchTasks, {
    refetchInterval: 10000,
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading tasks</p>;

  const fetchTasks = async () => {
    const response = await fetch('http://api.example.com/tasks');
    return response.json();
  };

  const handleDragEnd = (cardId, source, destination) => {
    // handle moving card from source to destination
  };

  const boardData = {
    lanes: [
      { id: 'draft', title: 'Draft', cards: data.draft || [] },
      { id: 'ready', title: 'Ready', cards: data.ready || [] },
      { id: 'in-progress', title: 'In Progress', cards: data.inProgress || [] },
      { id: 'done', title: 'Done', cards: data.done || [] },
    ],
  };

  return <Board data={boardData} draggable onCardMoveAcrossLanes={handleDragEnd} />;
};

export default Kanban;