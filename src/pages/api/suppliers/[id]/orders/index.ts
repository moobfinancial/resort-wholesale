import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';
import { requireAuth } from '../../../../../server/middleware/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await requireAuth(req, res);

    const supplierId = req.query.id as string;

    switch (req.method) {
      case 'GET':
        const orders = await prisma.supplierOrder.findMany({
          where: { supplierId },
          orderBy: { orderDate: 'desc' },
          include: {
            items: true,
          },
        });
        return res.json(orders);

      case 'POST':
        const { items, expectedDeliveryDate, notes } = req.body;

        // Calculate total amount
        const totalAmount = items.reduce(
          (sum: number, item: any) => sum + (item.quantity * item.unitPrice),
          0
        );

        // Generate order number (you might want to customize this)
        const orderNumber = `SO-${Date.now()}`;

        const order = await prisma.supplierOrder.create({
          data: {
            orderNumber,
            supplierId,
            totalAmount,
            expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
            notes,
            items: {
              create: items.map((item: any) => ({
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.quantity * item.unitPrice,
                notes: item.notes,
              })),
            },
          },
          include: {
            items: true,
          },
        });

        return res.status(201).json(order);

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Supplier orders API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
