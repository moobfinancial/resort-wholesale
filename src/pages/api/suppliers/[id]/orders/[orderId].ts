import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';
import { requireAuth } from '../../../../../server/middleware/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await requireAuth(req, res);

    const orderId = req.query.orderId as string;

    switch (req.method) {
      case 'GET':
        const order = await prisma.supplierOrder.findUnique({
          where: { id: orderId },
          include: {
            items: true,
            supplier: true,
          },
        });

        if (!order) {
          return res.status(404).json({ error: 'Order not found' });
        }

        return res.json(order);

      case 'PUT':
        const { status, expectedDeliveryDate, deliveredDate, notes, items } = req.body;

        // Calculate total amount if items are being updated
        const totalAmount = items?.reduce(
          (sum: number, item: any) => sum + (item.quantity * item.unitPrice),
          0
        );

        const updatedOrder = await prisma.supplierOrder.update({
          where: { id: orderId },
          data: {
            status,
            expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
            deliveredDate: deliveredDate ? new Date(deliveredDate) : undefined,
            notes,
            totalAmount: totalAmount || undefined,
            items: items ? {
              deleteMany: {},
              create: items.map((item: any) => ({
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.quantity * item.unitPrice,
                notes: item.notes,
              })),
            } : undefined,
          },
          include: {
            items: true,
          },
        });

        return res.json(updatedOrder);

      case 'DELETE':
        await prisma.supplierOrder.delete({
          where: { id: orderId },
        });

        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Supplier order API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
