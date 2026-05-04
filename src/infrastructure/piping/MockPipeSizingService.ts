export class MockPipeSizingService {
  id = "mock-pipe-sizing-service";
  name = "Mock pipe sizing service";

  getSizingStatus(): "not_calculated" {
    return "not_calculated";
  }
}
