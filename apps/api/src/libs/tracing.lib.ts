import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

export function initTracing(): void {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) return;

  const url = endpoint.endsWith('/v1/traces')
    ? endpoint
    : `${endpoint.replace(/\/$/, '')}/v1/traces`;

  // Dynamic import keeps cold-start fast when tracing is disabled.
  void import('@opentelemetry/sdk-node')
    .then(({ NodeSDK }) =>
      import('@opentelemetry/auto-instrumentations-node').then(({ getNodeAutoInstrumentations }) => {
        const sdk = new NodeSDK({
          serviceName: process.env.OTEL_SERVICE_NAME ?? 'community-marketplace-api',
          traceExporter: new OTLPTraceExporter({ url }),
          instrumentations: [getNodeAutoInstrumentations()],
        });
        sdk.start();
      }),
    )
    .catch(() => {
      // Tracing is optional — never block application boot.
    });
}
