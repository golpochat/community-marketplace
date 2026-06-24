import { Injectable } from '@nestjs/common';

import type { CreateReviewDto } from './dto/buyer.dto';

export interface ReviewRecord {
  id: string;
  userId: string;
  listingId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

@Injectable()
export class BuyerReviewsService {
  private readonly reviews: ReviewRecord[] = [];

  create(userId: string, dto: CreateReviewDto): ReviewRecord {
    const review: ReviewRecord = {
      id: `review-${Date.now()}`,
      userId,
      listingId: dto.listingId,
      rating: dto.rating,
      comment: dto.comment,
      createdAt: new Date().toISOString(),
    };
    this.reviews.push(review);
    return review;
  }

  findByUser(userId: string): ReviewRecord[] {
    return this.reviews.filter((review) => review.userId === userId);
  }
}
