import { Controller, Post, Body, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateRecordRequestDTO } from '../../components/Records/dtos/create-record.request.dto';

import { UpdateRecordRequestDTO } from '../../components/Records/dtos/update-record.request.dto';
import { RecordService } from '../Records/records.service';

@Controller('admin')
export class AdminController {
  constructor(private recordService: RecordService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new record' })
  @ApiResponse({ status: 201, description: 'Record successfully created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async create(@Body() request: CreateRecordRequestDTO): Promise<boolean> {
    return await this.recordService.createRecord(request);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing record' })
  @ApiResponse({ status: 200, description: 'Record updated successfully' })
  @ApiResponse({ status: 500, description: 'Cannot find record to update' })
  async update(
    @Param('id') id: string,
    @Body() updateRecordDto: UpdateRecordRequestDTO,
  ): Promise<void> {
    this.recordService.updateRecord(id, updateRecordDto);
  }
}
