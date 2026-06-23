// Node federation endpoints — authenticated by a shared X-Node-Token (a node is a
// trusted peer, not a user). A peer GETs /api/node/pull to drain our deltas;
// POST /api/node/pump triggers THIS node to pull from all its configured peers.
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../env.js';
import { changesForPeer, pumpFromPeers } from './service.js';
import type { NodeRole } from './policy.js';

function nodeAuth(req: FastifyRequest, reply: FastifyReply): boolean {
  if (req.headers['x-node-token'] !== env.nodeToken) { void reply.code(401).send({ error: 'bad_node_token' }); return false; }
  return true;
}

export async function nodeRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/node/pull', async (req, reply) => {
    if (!nodeAuth(req, reply)) return;
    const q = req.query as { tenant?: string; since?: string; peer?: string; peerRole?: string };
    if (!q.tenant || !q.peer || !q.peerRole) return reply.code(400).send({ error: 'missing_params' });
    return changesForPeer(q.tenant, Number(q.since ?? 0) || 0, env.nodeRole as NodeRole, q.peerRole as NodeRole, q.peer);
  });

  app.post('/api/node/pump', async (req, reply) => {
    if (!nodeAuth(req, reply)) return;
    const reports = await pumpFromPeers();
    return { node: env.nodeId, role: env.nodeRole, reports };
  });
}
