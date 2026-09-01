import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  conversationId!: string;

  @IsString()
  recipientId!: string;

  @IsOptional()
  @IsString()
  listingId?: string;

  @IsOptional()
  @IsEnum(['text', 'image', 'system'])
  type?: 'text' | 'image' | 'system';

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content!: string;
}

export class JoinConversationDto {
  @IsString()
  participantId!: string;

  @IsOptional()
  @IsString()
  listingId?: string;
}

export class MarkReadDto {
  @IsString()
  conversationId!: string;
}
