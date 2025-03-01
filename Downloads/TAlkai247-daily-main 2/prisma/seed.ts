import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@talkai247.com' },
    update: {},
    create: {
      email: 'admin@talkai247.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      settings: {
        defaultTransparencyLevel: 'FULL',
        recordingEnabled: true,
        webSearchEnabled: true,
        preferredVoice: 'male',
      },
    },
  });

  // Create demo user
  const demoPassword = await bcrypt.hash('demo123', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@talkai247.com' },
    update: {},
    create: {
      email: 'demo@talkai247.com',
      password: demoPassword,
      name: 'Demo User',
      company: 'Demo Company',
      role: 'USER',
      settings: {
        defaultTransparencyLevel: 'PARTIAL',
        recordingEnabled: true,
        webSearchEnabled: false,
        preferredVoice: 'female',
      },
    },
  });

  // Create system whisper templates
  const systemTemplates = [
    {
      name: 'Professional Tone',
      type: 'BUSINESS',
      systemPrompt: 'Maintain a professional and courteous tone throughout the conversation.',
      editablePrompt: 'Remind me to keep the conversation professional and focused on business objectives.',
      isSystem: true,
      tags: ['professional', 'business', 'communication'],
    },
    {
      name: 'Customer Support',
      type: 'BUSINESS',
      systemPrompt: 'Focus on understanding and resolving customer issues efficiently.',
      editablePrompt: 'Guide me to ask relevant questions and provide helpful solutions.',
      isSystem: true,
      tags: ['support', 'customer service', 'problem-solving'],
    },
    {
      name: 'Sales Approach',
      type: 'BUSINESS',
      systemPrompt: 'Help identify opportunities and present solutions effectively.',
      editablePrompt: 'Suggest ways to highlight product benefits and address customer needs.',
      isSystem: true,
      tags: ['sales', 'negotiation', 'persuasion'],
    },
    {
      name: 'Empathetic Listener',
      type: 'PERSONAL',
      systemPrompt: 'Focus on understanding and acknowledging emotions.',
      editablePrompt: 'Remind me to show empathy and validate feelings during the conversation.',
      isSystem: true,
      tags: ['empathy', 'personal', 'emotional intelligence'],
    },
  ];

  for (const template of systemTemplates) {
    await prisma.whisperTemplate.create({
      data: {
        ...template,
        userId: admin.id,
      },
    });
  }

  // Create demo resources
  const resources = [
    {
      title: 'Getting Started Guide',
      type: 'DOCUMENTATION',
      url: 'https://docs.talkai247.com/getting-started',
      description: 'Learn how to set up and use Talkai247 effectively.',
      tags: ['guide', 'setup', 'basics'],
      isPublic: true,
    },
    {
      title: 'Best Practices for AI Calls',
      type: 'GUIDE',
      url: 'https://docs.talkai247.com/best-practices',
      description: 'Tips and tricks for making the most of your AI calls.',
      tags: ['tips', 'optimization', 'quality'],
      isPublic: true,
    },
  ];

  for (const resource of resources) {
    await prisma.resource.create({
      data: {
        ...resource,
        userId: admin.id,
      },
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });