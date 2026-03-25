## ADDED Requirements

### Requirement: Configuration Loading
The system SHALL load configuration from files with environment variable support.

#### Scenario: JSON5 config file
- **WHEN** Config file exists at ~/.niuma/config.json5
- **THEN** System SHALL parse JSON5 format
- **AND** Support ${VAR} and ${VAR:default} interpolation

#### Scenario: Environment variable resolution
- **WHEN** Config contains ${API_KEY}
- **AND** API_KEY environment variable is set
- **THEN** Value SHALL be substituted
- **AND** If not set, use empty string or default if specified

### Requirement: Configuration Schema
Configuration SHALL be validated using Zod schemas.

#### Scenario: Provider configuration
- **WHEN** Config contains provider section
- **THEN** It SHALL have type, model, apiKey?, apiBase?, temperature?, maxTokens?

#### Scenario: Validation errors
- **WHEN** Config fails validation
- **THEN** System SHALL throw descriptive error
- **AND** Indicate which field is invalid

### Requirement: Default Configuration
The system SHALL provide sensible defaults for all configuration options.

#### Scenario: Missing optional fields
- **WHEN** Config omits optional fields
- **THEN** Default values SHALL be used
- **AND** maxIterations SHALL default to 40
- **AND** temperature SHALL default to 0.7
