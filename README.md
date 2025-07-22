# Rechat Lead Capture API Demo

A simple form application to test the Rechat Lead Capture API integration with all available fields.

## Features

- Complete form with all API fields (all optional)
- Configurable API key input
- Configurable lead channel ID
- Real-time API testing
- Response display
- Docker containerization support

## API Fields Supported

- `first_name` - Contact's first name
- `last_name` - Contact's last name  
- `email` - Contact's email address
- `phone_number` - Contact's phone number
- `tag` - Custom tag for categorization
- `lead_source` - Source of the lead
- `note` - Additional notes or messages
- `address` - Property address of interest
- `referer_url` - Referring URL
- `mlsid` - MLS listing ID
- `agent_mlsid` - Agent's MLS ID

## Getting Started

### Local Development

1. Install dependencies:
```bash
npm install
```

1. Run the development server:
```bash
npm run dev
```

1. Open [http://localhost:3000](http://localhost:3000) in your browser

### Docker

1. Build the Docker image:
```bash
docker build -t rechat-lead-demo .
```

1. Run the container:
```bash
docker run -p 3000:3000 rechat-lead-demo
```

1. Open [http://localhost:3000](http://localhost:3000) in your browser

## Configuration

- **Lead Channel**: Default is `54a57918-ad9b-4adb-a35a-9232bf78d734`
- **API Key**: Optional, can be entered in the form
- **Default Values**: Pre-filled with demo values for testing

## API Integration

The form submits to: `https://api.rechat.com/leads/channels/{lead_channel}/webhook`

All fields except for `source_type` are optional according to the API specification. The app will only send fields that have values.

## Documentation

See the [`docs/`](/docs/) folder for:

- [`openapi.yml`](/docs/openapi.yml) - Complete API specification for the Rechat Lead Capture API

## Contact Rechat

For production use, contact [Rechat's support team](https://help.rechat.com/appendix/contacting-support) for integration guidance.

For more information about lead capture integration, visit the [Rechat documentation](https://help.rechat.com/appendix/brokerage-set-up/lead-capture).
