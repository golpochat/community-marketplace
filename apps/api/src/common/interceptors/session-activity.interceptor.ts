import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

import { isMarketplaceRole } from '@community-marketplace/types';

import type { AuthenticatedUser } from '../decorators/current-user.decorator';
import { SessionService } from '../../modules/auth/services/session.service';

/** Throttle DB writes: at most one touch per session within this window. */
const TOUCH_THROTTLE_MS = 60 * 1000;

@Injectable()
export class SessionActivityInterceptor implements NestInterceptor {
  private readonly lastTouchBySession = new Map<string, number>();

  constructor(private readonly sessionService: SessionService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (user?.sessionId && isMarketplaceRole(user.role)) {
      this.maybeTouch(user.sessionId);
    }

    return next.handle();
  }

  private maybeTouch(sessionId: string): void {
    const now = Date.now();
    const last = this.lastTouchBySession.get(sessionId) ?? 0;
    if (now - last < TOUCH_THROTTLE_MS) return;

    this.lastTouchBySession.set(sessionId, now);
    void this.sessionService.touchActivity(sessionId).catch(() => {
      // Activity touch must not fail the request
    });

    // Bound memory for long-lived processes
    if (this.lastTouchBySession.size > 5000) {
      const cutoff = now - TOUCH_THROTTLE_MS * 2;
      for (const [id, touchedAt] of this.lastTouchBySession) {
        if (touchedAt < cutoff) this.lastTouchBySession.delete(id);
      }
    }
  }
}
