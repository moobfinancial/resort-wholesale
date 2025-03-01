import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { validateCall } from '../../lib/validation';
import type { Call } from '../../types/schema';
import type { ApiResponse, PaginatedResponse } from '../../types/schema';
import { Prisma, CallStatus } from '@prisma/client';

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        [key: string]: any;
      };
    }
  }
}

const router = Router();

// Map Prisma enum values to schema string literals
const mapCallStatus = (status: CallStatus): 'scheduled' | 'in-progress' | 'completed' | 'failed' => {
  const statusMap: Record<CallStatus, 'scheduled' | 'in-progress' | 'completed' | 'failed'> = {
    [CallStatus.SCHEDULED]: 'scheduled',
    [CallStatus.IN_PROGRESS]: 'in-progress',
    [CallStatus.COMPLETED]: 'completed',
    [CallStatus.FAILED]: 'failed'
  };
  return statusMap[status];
};

// Get paginated calls
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, contactId, assistantId, status } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where: Prisma.CallWhereInput = {
      ...(req.user?.id && { userId: req.user.id }),
      ...(contactId && { contactId: String(contactId) }),
      ...(assistantId && { assistantId: String(assistantId) }),
      ...(status && { status: status as CallStatus }),
    };

    const [calls, total] = await Promise.all([
      prisma.call.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { startTime: 'desc' },
        include: {
          contact: true,
          assistant: true,
        },
      }),
      prisma.call.count({ where }),
    ]);

    const response: ApiResponse<PaginatedResponse<Call>> = {
      success: true,
      data: {
        items: calls.map(call => {
          // Create a properly typed object for the call
          const typedCall: Call = {
            id: call.id,
            userId: call.userId,
            contactId: call.contactId,
            assistantId: call.assistantId,
            startTime: call.startTime,
            endTime: call.endTime || undefined,
            duration: call.duration || undefined,
            status: mapCallStatus(call.status),
            recording: call.recording && typeof call.recording === 'object' ? {
              url: String((call.recording as Record<string, any>).url || ''),
              duration: Number((call.recording as Record<string, any>).duration || 0)
            } : undefined,
            transcript: Array.isArray(call.transcript) ? 
              call.transcript.map((item: any) => ({
                id: String(item?.id || ''),
                timestamp: item?.timestamp ? new Date(item.timestamp) : new Date(),
                speaker: (item?.speaker === 'ai' || item?.speaker === 'user') ? item.speaker : 'user',
                message: String(item?.message || '')
              })) : [],
            goals: Array.isArray(call.goals) ? 
              call.goals.map((goal: any) => ({
                id: String(goal?.id || ''),
                title: String(goal?.title || ''),
                progress: Number(goal?.progress || 0),
                completed: Boolean(goal?.completed),
                aiPrompt: String(goal?.aiPrompt || ''),
                resources: {
                  urls: Array.isArray(goal?.resources?.urls) ? goal.resources.urls.map(String) : [],
                  files: Array.isArray(goal?.resources?.files) ? goal.resources.files.map(String) : []
                }
              })) : [],
            metrics: {
              averageSentiment: Number((call.metrics as Record<string, any>)?.averageSentiment || 0),
              sentimentTimeline: Array.isArray((call.metrics as Record<string, any>)?.sentimentTimeline) ? 
                (call.metrics as Record<string, any>).sentimentTimeline.map((point: any) => ({
                  timestamp: point?.timestamp ? new Date(point.timestamp) : new Date(),
                  value: Number(point?.value || 0)
                })) : [],
              whisperEffectiveness: Number((call.metrics as Record<string, any>)?.whisperEffectiveness || 0),
              goalCompletion: Number((call.metrics as Record<string, any>)?.goalCompletion || 0)
            },
            notes: call.notes || undefined,
            createdAt: call.createdAt,
            updatedAt: call.updatedAt
          };
          
          return typedCall;
        }),
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize)),
      },
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch calls',
        details: error,
      },
    });
  }
});

// Get call by ID
router.get('/:id', async (req, res) => {
  try {
    const call = await prisma.call.findUnique({
      where: { id: req.params.id },
      include: {
        contact: true,
        assistant: true,
      },
    });

    if (!call) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Call not found',
        },
      });
    }

    res.json({
      success: true,
      data: {
        ...call,
        status: mapCallStatus(call.status)
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch call',
        details: error,
      },
    });
  }
});

// Start new call
router.post('/start', async (req, res) => {
  try {
    const validation = validateCall(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid call data',
          details: validation.errors,
        },
      });
    }

    const call = await prisma.call.create({
      data: {
        ...req.body,
        userId: req.user?.id,
        status: 'IN_PROGRESS' as CallStatus,
        startTime: new Date(),
      },
      include: {
        contact: true,
        assistant: true,
      },
    });

    // Update contact's lastContactedAt
    await prisma.contact.update({
      where: { id: call.contactId },
      data: { lastContactedAt: new Date() },
    });

    res.status(201).json({
      success: true,
      data: {
        ...call,
        status: mapCallStatus(call.status)
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to start call',
        details: error,
      },
    });
  }
});

// End call
router.post('/:id/end', async (req, res) => {
  try {
    const call = await prisma.call.update({
      where: { id: req.params.id },
      data: {
        status: 'COMPLETED' as CallStatus,
        endTime: new Date(),
        duration: req.body.duration,
        metrics: req.body.metrics,
        transcript: req.body.transcript,
        recording: req.body.recording,
      },
      include: {
        contact: true,
        assistant: true,
      },
    });

    res.json({
      success: true,
      data: {
        ...call,
        status: mapCallStatus(call.status)
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to end call',
        details: error,
      },
    });
  }
});

// Update call goals
router.put('/:id/goals', async (req, res) => {
  try {
    const call = await prisma.call.update({
      where: { id: req.params.id },
      data: {
        goals: req.body.goals,
      },
    });

    res.json({
      success: true,
      data: {
        ...call,
        status: mapCallStatus(call.status)
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update call goals',
        details: error,
      },
    });
  }
});

// Add call note
router.post('/:id/notes', async (req, res) => {
  try {
    const call = await prisma.call.update({
      where: { id: req.params.id },
      data: {
        notes: req.body.note,
      },
    });

    res.json({
      success: true,
      data: {
        ...call,
        status: mapCallStatus(call.status)
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to add call note',
        details: error,
      },
    });
  }
});

export default router;