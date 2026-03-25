## ADDED Requirements

### Requirement: Search Engine Abstraction
The system SHALL support multiple search engines through a common interface.

#### Scenario: Brave Search
- **WHEN** Brave engine is configured with API key
- **AND** Search is called with query
- **THEN** Engine SHALL call Brave Search API
- **AND** Return normalized SearchResult array

#### Scenario: Tavily Search
- **WHEN** Tavily engine is configured with API key
- **AND** Search is called with query
- **THEN** Engine SHALL call Tavily Search API
- **AND** Return normalized SearchResult array

#### Scenario: Result normalization
- **WHEN** Any search engine returns results
- **THEN** Results SHALL be normalized to {title, url, snippet, date?} format

### Requirement: Search Engine Factory
The system SHALL provide factory functions for creating search engines.

#### Scenario: Engine creation by type
- **WHEN** createSearchEngine({engine: "brave", apiKey}) is called
- **THEN** Factory SHALL return BraveSearchEngine instance

#### Scenario: Auto-selection
- **WHEN** createDefaultSearchEngine() is called
- **AND** TAVILY_API_KEY environment variable is set
- **THEN** Factory SHALL return TavilySearchEngine
- **AND** If not, but BRAVE_API_KEY is set, return BraveSearchEngine
- **AND** If neither, return MockSearchEngine
