import { Server, Socket } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { NextApiRequest, NextApiResponse } from 'next';
import { SOCKET_EVENTS } from '@/lib/constants/socket-events';
import type { Socket as NetSocket } from 'net';

interface SocketServer extends HTTPServer {
  io?: Server;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

const socketHandler = (_: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (res.socket.server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on(SOCKET_EVENTS.CONNECT, (socket: Socket) => {
      console.log('A user connected');

      socket.on(SOCKET_EVENTS.TASK_UPDATE, (payload) => {
        socket.broadcast.emit(SOCKET_EVENTS.TASK_UPDATE, payload);
      });

      socket.on(SOCKET_EVENTS.TASK_CREATE, (payload) => {
        socket.broadcast.emit(SOCKET_EVENTS.TASK_CREATE, payload);
      });

      socket.on(SOCKET_EVENTS.TASK_DELETE, (payload) => {
        socket.broadcast.emit(SOCKET_EVENTS.TASK_DELETE, payload);
      });

      socket.on(SOCKET_EVENTS.DISCONNECT, () => {
        console.log('A user disconnected');
      });
    });
  }
  res.end();
};

export default socketHandler;
