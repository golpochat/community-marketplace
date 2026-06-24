import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationTemplateEngineService {
  render(template: string, variables: Record<string, string> = {}): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? '');
  }

  preview(
    titleTemplate: string,
    bodyTemplate: string,
    variables: Record<string, string> = {},
  ) {
    return {
      title: this.render(titleTemplate, variables),
      message: this.render(bodyTemplate, variables),
    };
  }
}
