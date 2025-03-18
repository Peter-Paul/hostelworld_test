import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from './schemas/order.schema';
import { CreateOrderRequestDTO } from './dtos/create-order.request.dto';
import { RecordService } from '../Records/records.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel('Order') private readonly orderModel: Model<Order>,
    private readonly recordService: RecordService,
  ) {}

  async createOrder(request: CreateOrderRequestDTO): Promise<void> {
    await this.orderModel.create(request);
  }
}
