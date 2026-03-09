## ADDED Requirements

### Requirement: Configuration schema validation

The system SHALL use zod to define and validate configuration schemas.

#### Scenario: NiumaConfig schema validates main config
- **WHEN** loading configuration
- **THEN** NiumaConfigSchema SHALL validate workDir, model, maxIterations, enableMemory, providers, channels fields

#### Scenario: Provider config schema validates provider settings
- **WHEN** configuring an LLM provider
- **THEN** ProviderConfigSchema SHALL validate model, apiKey, apiBase, extra fields

#### Scenario: Channel config schema validates channel settings
- **WHEN** configuring a message channel
- **THEN** ChannelConfigSchema SHALL validate type, enabled, config fields

### Requirement: Configuration loading from multiple sources

The system SHALL load and merge configuration from multiple sources with defined priority.

#### Scenario: Default config provides base values
- **WHEN** no config file or env vars exist
- **THEN** default values SHALL be used (model: gpt-4o, maxIterations: 10, enableMemory: true)

#### Scenario: Environment variables override defaults
- **WHEN** OPENAI_API_KEY or NIUMA_MODEL env vars are set
- **THEN** they SHALL override default config values

#### Scenario: Config file has highest priority
- **WHEN** niuma.json or .niumarc exists
- **THEN** file config SHALL override env vars and defaults

### Requirement: Configuration file discovery

The system SHALL search for configuration files in standard locations.

#### Scenario: Search current directory first
- **WHEN** loading config
- **THEN** current directory SHALL be searched for niuma.json, .niuma.json, .niumarc

#### Scenario: Fall back to home directory
- **WHEN** no config in current directory
- **THEN** user home directory SHALL be searched
