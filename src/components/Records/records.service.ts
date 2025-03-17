import { Inject, Injectable } from '@nestjs/common';
import { Record } from './schemas/record.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RecordService {
  pageLimit: number = 10;
  constructor(
    @InjectModel('Record') private readonly recordModel: Model<Record>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getAllRecords(
    page: number,
    q?: string,
    artist?: string,
    album?: string,
    format?: string,
    category?: string,
  ): Promise<{ records: Record[]; total: number }> {
    const query: any = {};

    // Check and return from cache
    const cacheKey = `records:${q || ''}:${page || ''}:${artist || ''}:${album || ''}:${format || ''}:${category || ''}`;
    const cachedRecords = await this.cacheManager.get<{
      records: Record[];
      total: number;
    }>(cacheKey);

    if (cachedRecords) {
      return cachedRecords;
    }

    if (q) {
      query.$or = [
        { artist: new RegExp(q, 'i') },
        { album: new RegExp(q, 'i') },
        { category: new RegExp(q, 'i') },
      ];
    }

    if (artist) {
      query.artist = new RegExp(artist, 'i');
    }

    if (album) {
      query.album = new RegExp(album, 'i');
    }

    if (format) {
      query.format = format;
    }

    if (category) {
      query.category = category;
    }

    const skip = (page - 1) * this.pageLimit;
    const [records, total] = await Promise.all([
      this.recordModel
        .find(query)
        .skip(skip)
        .limit(Number(this.pageLimit))
        .exec(),
      this.recordModel.countDocuments(query),
    ]);
    // Cache the records
    await this.saveInCache(records, total, cacheKey);

    return { records, total };
  }

  async saveInCache(
    records: Record[],
    total: number,
    cacheKey: string,
    duration: number = 120, // 2 minutes
  ): Promise<void> {
    await this.cacheManager.set<{ records: Record[]; total: number }>(
      cacheKey,
      { records, total },
      duration,
    );
  }
}
