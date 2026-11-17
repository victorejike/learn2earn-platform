import net from 'net';

const server = net.createServer((socket) => {
  const target = net.connect(3000, '127.0.0.1');
  socket.pipe(target).pipe(socket);
  socket.on('error', () => target.destroy());
  target.on('error', () => socket.destroy());
});

server.listen(3001, '0.0.0.0', () => {
  console.log('Port forwarder active: http://localhost:3001 -> http://localhost:3000');
});
