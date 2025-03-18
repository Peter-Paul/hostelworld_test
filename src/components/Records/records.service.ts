import { Inject, Injectable } from '@nestjs/common';
import { Record } from './schemas/record.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import axios from 'axios';
import { CreateRecordRequestDTO } from './dtos/create-record.request.dto';
import { RecordFormat } from './schemas/record.enum';
import { UpdateRecordRequestDTO } from './dtos/update-record.request.dto';
// import * as convert from 'xml-js';

type Recording = {
  id: string;
  score: number;
  title: string;
  length: number;
  video: string;
  'artist-credit': [];
  'first-release-date': string;
  releases: Releases[];
  tags: Tag[];
};

type Tag = {
  count: number;
  name: string;
};

type Releases = {
  id: string;
  'status-id': string;
  count: number;
  title: string;
  status: string;
  'artist-credit': ArtistCredit[];
  'release-group': [];
  date: string;
  country: string;
  'release-events': [];
  'track-count': number;
  media: Media[];
};

type ArtistCredit = {
  name: 'The Beatles';
  artist: any;
};

type Media = {
  position: number;
  format: string;
  track: Track[];
  'track-count': number;
  'track-offset': number;
};

type Track = {
  id?: string;
  number?: string;
  title?: string;
  length?: number;
  format?: string;
  album?: string;
  artist?: string;
  price?: number;
  qty?: number;
  trackId?: string;
  mbid?: string;
};

@Injectable()
export class RecordService {
  pageLimit: number = 10;
  constructor(
    @InjectModel('Record') private readonly recordModel: Model<Record>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async createRecord(request: CreateRecordRequestDTO): Promise<boolean> {
    try {
      const response = await axios.get(
        `https://musicbrainz.org/ws/2/recording/?query=arid:${request.mbid}`,
        { headers: { Accept: 'application/json' } },
      );
      // If you want to use XML instead of JSON, you can use the following code:
      //   const jsonData = convert.xml2json(response.data, {
      //     compact: true,
      //     spaces: 4,
      //   });

      const recordings: Recording[] | undefined = response.data.recordings;

      if (!recordings || recordings.length === 0) {
        await this.recordModel.create({
          artist: request.artist,
          album: request.album,
          price: request.price,
          trackId: '',
          qty: request.qty,
          format: request.format,
          category: request.category,
          mbid: request.mbid,
        });
      }

      const trackList: Track[] = recordings.flatMap((recording) =>
        recording.releases.flatMap((release) =>
          release.media.flatMap((media) =>
            [...media.track].map((track) => {
              return {
                price: request.price,
                qty: request.qty,
                trackId: track.id,
                album: release.title,
                artist: release['artist-credit'][0].name,
                format: this.getFormat(media.format ?? ''),
                mbid: request.mbid,
              };
            }),
          ),
        ),
      );

      const bulkOps = trackList.map((track) => ({
        updateOne: {
          filter: {
            artist: track.artist,
            format: track.format,
            album: track.album,
          }, // Match by trackId
          update: { $set: track }, // Update with new data
          upsert: true, // Insert if not found
        },
      }));

      await this.recordModel.bulkWrite(bulkOps);

      console.log(
        `Successfully created ${trackList.length} records for mbid: ${request.mbid}`,
      );
      return true;
    } catch (error) {
      console.error('Error adding record:', error);
      return false;
    }
  }

  async updateRecord(
    id: string,
    updateRecordDto: UpdateRecordRequestDTO,
  ): Promise<void> {
    try {
      const result = await this.recordModel.updateOne(
        { _id: id }, // Find by `_id`
        { $set: updateRecordDto }, // Update fields
      );

      console.log(
        'Matched:',
        result.matchedCount,
        'Updated:',
        result.modifiedCount,
      );
    } catch (error) {
      console.error('Error updating record:', error);
    }
  }

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

  getFormat(format: string): RecordFormat {
    let recordFormat: RecordFormat = RecordFormat.VINYL; // Default to Vinyl
    for (const key in RecordFormat) {
      if (format.toLowerCase().includes(key.toLowerCase())) {
        recordFormat = RecordFormat[key];
      }
    }
    return recordFormat;
  }

  async getRecord(id: string): Promise<Record> {
    return await this.recordModel.findById(id).exec();
  }
}
