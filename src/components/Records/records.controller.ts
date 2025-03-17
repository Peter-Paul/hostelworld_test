import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Put,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Record } from '../../components/Records/schemas/record.schema';
import { Model } from 'mongoose';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CreateRecordRequestDTO } from '../../components/Records/dtos/create-record.request.dto';
import {
  RecordCategory,
  RecordFormat,
} from '../../components/Records/schemas/record.enum';
import { UpdateRecordRequestDTO } from '../../components/Records/dtos/update-record.request.dto';
import { RecordService } from './records.service';

@Controller('records')
export class RecordController {
  constructor(
    @InjectModel('Record') private readonly recordModel: Model<Record>,
    private recordService: RecordService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new record' })
  @ApiResponse({ status: 201, description: 'Record successfully created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async create(@Body() request: CreateRecordRequestDTO): Promise<Record> {
    return await this.recordModel.create({
      artist: request.artist,
      album: request.album,
      price: request.price,
      qty: request.qty,
      format: request.format,
      category: request.category,
      mbid: request.mbid,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing record' })
  @ApiResponse({ status: 200, description: 'Record updated successfully' })
  @ApiResponse({ status: 500, description: 'Cannot find record to update' })
  async update(
    @Param('id') id: string,
    @Body() updateRecordDto: UpdateRecordRequestDTO,
  ): Promise<Record> {
    const record = await this.recordModel.findById(id);
    if (!record) {
      throw new InternalServerErrorException('Record not found');
    }

    Object.assign(record, updateRecordDto);

    const updated = await this.recordModel.updateOne(record);
    if (!updated) {
      throw new InternalServerErrorException('Failed to update record');
    }

    return record;
  }

  @Get()
  @ApiOperation({ summary: 'Get all records with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'List of records',
    type: [Record],
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default is 1, each page has 10 records)',
    type: String,
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description:
      'Search query (search across multiple fields like artist, album, category, etc.)',
    type: String,
  })
  @ApiQuery({
    name: 'artist',
    required: false,
    description: 'Filter by artist name',
    type: String,
  })
  @ApiQuery({
    name: 'album',
    required: false,
    description: 'Filter by album name',
    type: String,
  })
  @ApiQuery({
    name: 'format',
    required: false,
    description: 'Filter by record format (Vinyl, CD, etc.)',
    enum: RecordFormat,
    type: String,
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by record category (e.g., Rock, Jazz)',
    enum: RecordCategory,
    type: String,
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('q') q?: string,
    @Query('artist') artist?: string,
    @Query('album') album?: string,
    @Query('format') format?: RecordFormat,
    @Query('category') category?: RecordCategory,
  ): Promise<{ records: Record[]; total: number }> {
    return await this.recordService.getAllRecords(
      page,
      q,
      artist,
      album,
      format,
      category,
    );
  }
}
