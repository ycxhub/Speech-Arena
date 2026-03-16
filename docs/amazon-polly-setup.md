# Amazon Polly Provider Setup

Amazon Polly uses AWS IAM credentials instead of a single API key. This document covers how to set it up in the Speech Arena admin panel.

## 1. Create an AWS IAM User

1. Go to the [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Create a new IAM user (e.g. `speecharena-polly`)
3. Attach a policy with at minimum these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "polly:SynthesizeSpeech",
        "polly:DescribeVoices"
      ],
      "Resource": "*"
    }
  ]
}
```

4. Generate an **Access Key** for the user. Save the Access Key ID and Secret Access Key.

## 2. Add the Provider in Admin

If the Amazon Polly provider doesn't already exist:

1. Go to Admin > Providers
2. Create a new provider with:
   - **Name**: `Amazon Polly`
   - **Slug**: `amazon-polly`

## 3. Add the API Key

Go to Admin > Providers > Amazon Polly > API Keys and add a new key.

**The key must be a JSON string** with this exact format:

```json
{"accessKeyId": "AKIAIOSFODNN7EXAMPLE", "secretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY", "region": "us-east-1"}
```

| Field | Description |
|-------|-------------|
| `accessKeyId` | Your AWS IAM Access Key ID |
| `secretAccessKey` | Your AWS IAM Secret Access Key |
| `region` | AWS region for Polly (e.g. `us-east-1`, `eu-west-1`) |

If `region` is omitted, it defaults to `us-east-1`.

## 4. Add Model Definitions

Go to Admin > Providers > Amazon Polly > Models and add definitions:

| Name | Model ID | Notes |
|------|----------|-------|
| Amazon Polly Neural | `neural` | Neural engine voices |
| Amazon Polly Standard | `standard` | Standard engine voices (future) |
| Amazon Polly Generative | `generative` | Generative engine voices (future) |

The `model_id` maps directly to the Polly `Engine` parameter.

## 5. Add Voices

Go to Admin > Providers > Amazon Polly > Voices.

Polly voice IDs are human-readable names, not UUIDs. Common Neural-compatible voices:

### English (US) - `en-US`
| Voice ID | Gender | Notes |
|----------|--------|-------|
| `Joanna` | Female | Popular, clear |
| `Matthew` | Male | Natural, conversational |
| `Ruth` | Female | Neural only |
| `Stephen` | Male | Neural only |
| `Danielle` | Female | Neural + Generative |
| `Gregory` | Male | Neural + Generative |

### English (UK) - `en-GB`
| Voice ID | Gender | Notes |
|----------|--------|-------|
| `Amy` | Female | British accent |
| `Arthur` | Male | British accent |

### English (IN) - `en-IN`
| Voice ID | Gender | Notes |
|----------|--------|-------|
| `Kajal` | Female | Indian English |

### Hindi - `hi-IN`
| Voice ID | Gender | Notes |
|----------|--------|-------|
| `Kajal` | Female | Also supports Hindi |

### Spanish - `es-ES` / `es-US`
| Voice ID | Gender | Locale |
|----------|--------|--------|
| `Lucia` | Female | es-ES |
| `Lupe` | Female | es-US |
| `Pedro` | Male | es-US |

For a complete list, see:
https://docs.aws.amazon.com/polly/latest/dg/voicelist.html

**Important**: Not all voices support the Neural engine. Only add voices that
are listed as Neural-compatible in the AWS documentation. Using an incompatible
voice will result in a generation error.

## 6. Create the Playground Page

Go to Admin > Murf Playground and create a new page:

| Field | Value |
|-------|-------|
| Slug | `falcon-vs-polly-neural` |
| Title | `Compare Murf Falcon vs Amazon Polly Neural` |
| Headline | `Compare Murf Falcon and Amazon Polly Neural` |
| Model A Label | `Murf Falcon` |
| Model A Provider Slug | `murf` |
| Model A Model ID | `FALCON` |
| Model B Label | `Amazon Polly Neural` |
| Model B Provider Slug | `amazon-polly` |
| Model B Model ID | `neural` |

Then add sample sentences under the edit page for each language.

## How It Differs from Other Providers

| Aspect | Other Providers (Murf, ElevenLabs, etc.) | Amazon Polly |
|--------|------------------------------------------|--------------|
| API Key | Single string (API key or token) | JSON with `accessKeyId`, `secretAccessKey`, `region` |
| Authentication | HTTP header (`api-key`, `Authorization`) | AWS SDK v4 signing (handled by `@aws-sdk/client-polly`) |
| Voice IDs | Provider-specific IDs or UUIDs | Human-readable names (e.g. `Joanna`, `Matthew`) |
| Model selection | Via `model` or `modelId` field | Via `Engine` parameter (`neural`, `standard`, `generative`) |
| Language codes | Varies by provider | Full locale codes required (e.g. `en-US`, not `en`) |
