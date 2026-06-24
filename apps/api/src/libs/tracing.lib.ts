export function initTracing(): void {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) return;

  // Dynamic import keeps cold-start fast when tracing is disabled.
  void import('@opentelemetry/sdk-node')
    .then(({ NodeSDK }) =>
      import('@opentelemetry/auto-instrumentations-node').then(({ getNodeAutoInstrumentations }) => {
        const sdk = new NodeSDK({
          serviceName: process.env.OTEL_SERVICE_NAME ?? 'community-marketplace-api',
          traceExporter: undefined,
          instrumentations: [getNodeAutoInstrumentations()],
        });
        sdk.start();
      }),
    )
    .catch(() => {
      // Tracing is optional — never block application boot.
    });
}
