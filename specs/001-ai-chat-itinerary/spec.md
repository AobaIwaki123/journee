# Feature Specification: AI Chat-Based Itinerary Creation

**Feature Branch**: `001-ai-chat-itinerary`
**Created**: 2025-10-26
**Status**: Draft
**Input**: User description: "AIとチャットしながら旅のしおりを作成する機能"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Basic Itinerary Creation through Chat (Priority: P1)

A user visits Journee and wants to create a simple travel itinerary by conversing with an AI assistant. The user describes their travel desires (destination, duration, interests) in natural language, and the AI responds with suggestions while building an itinerary in real-time.

**Why this priority**: This is the core value proposition of Journee - conversational itinerary creation. Without this, the application has no MVP. Users must be able to have a basic conversation and see an itinerary form as a result.

**Independent Test**: Can be fully tested by opening the app, typing travel requests in the chat interface, and verifying that an itinerary appears and updates as the conversation progresses.

**Acceptance Scenarios**:

1. **Given** a user opens the Journee application for the first time, **When** they type "東京3日間の旅行を計画したい" (I want to plan a 3-day trip to Tokyo) in the chat, **Then** the AI responds with destination confirmation and initial suggestions, and an itinerary preview begins to form
2. **Given** the user is chatting with the AI, **When** they provide additional details like "美術館が好き" (I like museums), **Then** the AI suggests relevant museums and the itinerary updates to include museum visits
3. **Given** an itinerary is being created, **When** the user asks for budget advice, **Then** the AI provides budget estimates and the itinerary displays cost information for each item
4. **Given** the conversation has covered destination, duration, and interests, **When** the user indicates they are satisfied, **Then** the system presents a complete itinerary with title, days, activities, and timing

---

### User Story 2 - Itinerary Preview and Real-Time Updates (Priority: P2)

As the user chats with the AI, they want to see the itinerary forming visually in real-time alongside the conversation. The preview should update automatically as new information is discussed, allowing the user to see their travel plan take shape without manual input.

**Why this priority**: Visual feedback is critical for user confidence and engagement. Users need to see that their conversation is producing tangible results. This transforms abstract chat into concrete planning.

**Independent Test**: Can be tested by conducting a chat session and verifying that each AI response that contains itinerary information (destinations, activities, timing) causes the preview panel to update immediately without page refresh.

**Acceptance Scenarios**:

1. **Given** a user is chatting about their trip, **When** the AI mentions specific activities like "浅草寺を訪問" (visit Senso-ji Temple), **Then** the itinerary preview displays a new entry for that activity with appropriate day and time
2. **Given** the itinerary preview shows Day 1 with morning activities, **When** the AI suggests an afternoon activity, **Then** the preview updates to show the afternoon slot filled
3. **Given** the user has three days planned, **When** they ask to extend to four days, **Then** the preview immediately shows a Day 4 section
4. **Given** the itinerary is being built, **When** the AI provides timing estimates, **Then** each activity shows its duration or time slot in the preview

---

### User Story 3 - Conversational Refinement and Itinerary Adjustment (Priority: P3)

After seeing the initial itinerary, users want to refine it through continued conversation. They can ask the AI to change activities, adjust timing, swap days, or add/remove items by simply describing what they want in natural language.

**Why this priority**: This differentiates Journee from static planning tools. Users should be able to iterate on their plan conversationally rather than through manual editing. However, the core value (P1 + P2) must work first.

**Independent Test**: Can be tested by creating an initial itinerary (P1), then asking the AI to make changes like "1日目のランチを変更したい" (I want to change Day 1 lunch), and verifying the itinerary updates accordingly.

**Acceptance Scenarios**:

1. **Given** an itinerary with a museum visit on Day 1, **When** the user says "美術館は苦手なので別の場所に変えて" (I don't like museums, change it to something else), **Then** the AI suggests alternatives and updates the itinerary with the selected option
2. **Given** a three-day itinerary, **When** the user asks "もっと予算を抑えたい" (I want to reduce the budget), **Then** the AI suggests lower-cost alternatives and the itinerary updates with budget-friendly options
3. **Given** activities scheduled from morning to evening, **When** the user says "もっとゆっくりしたペースがいい" (I prefer a more relaxed pace), **Then** the AI reduces the number of activities per day and adds rest time
4. **Given** an itinerary with generic activities, **When** the user mentions specific interests like "写真撮影" (photography), **Then** the AI suggests photo-worthy locations and updates the itinerary accordingly

---

### User Story 4 - Multi-Turn Conversation with Context Retention (Priority: P4)

Users want to have natural, extended conversations where the AI remembers previous messages and maintains context. Users should be able to reference earlier parts of the conversation without repeating information.

**Why this priority**: Natural conversation requires context. Without this, users must repeat themselves, which breaks the conversational experience. However, basic chat (P1) can work without perfect context retention.

**Independent Test**: Can be tested by having a conversation where the user establishes preferences early (e.g., "budget is 50,000 yen"), then later asks contextual questions (e.g., "what about dinner options?") and verifying the AI considers the budget constraint without being reminded.

**Acceptance Scenarios**:

1. **Given** the user mentions "2人旅行" (traveling with 2 people) early in the conversation, **When** they later ask about restaurant recommendations, **Then** the AI suggests places suitable for 2 people without being reminded
2. **Given** the user indicates they dislike crowded places, **When** they ask for activity suggestions later, **Then** the AI avoids suggesting popular tourist spots during peak hours
3. **Given** a conversation spanning 10+ messages, **When** the user says "前に話した寺について詳しく教えて" (tell me more about the temple we discussed earlier), **Then** the AI recalls the specific temple mentioned previously
4. **Given** the user has expressed a budget limit, **When** new suggestions are made throughout the conversation, **Then** all suggestions stay within the stated budget

---

### Edge Cases

- What happens when the user's request is too vague (e.g., "旅行したい" / "I want to travel" with no destination or timeframe)?
- How does the system handle contradictory requests (e.g., "budget trip" but requesting luxury hotels)?
- What if the AI cannot generate suggestions for an obscure destination?
- How does the system behave when the AI API is slow or times out?
- What happens if the user switches topics mid-conversation (e.g., from Tokyo trip to Osaka trip)?
- How does the system handle very long conversations (50+ messages) with large itineraries (7+ days)?
- What if the user requests impossible timing (e.g., too many activities for one day)?
- How does the system respond to non-travel-related questions or inappropriate content?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a chat interface where users can type natural language messages in Japanese
- **FR-002**: System MUST send user messages to an AI service and stream responses back in real-time
- **FR-003**: System MUST parse AI responses to extract itinerary information (destinations, activities, dates, times, costs)
- **FR-004**: System MUST display a visual itinerary preview that updates automatically as information is extracted from the conversation
- **FR-005**: System MUST maintain conversation history for the current session
- **FR-006**: System MUST handle AI service errors gracefully and inform users when responses cannot be generated
- **FR-007**: Users MUST be able to see AI responses appearing progressively (streaming) rather than waiting for complete responses
- **FR-008**: System MUST support multi-turn conversations where the AI can reference earlier messages
- **FR-009**: System MUST allow users to start a new conversation and clear the current itinerary
- **FR-010**: The itinerary preview MUST organize content by days and time slots (morning, afternoon, evening)
- **FR-011**: System MUST display placeholder or loading state while AI is generating responses
- **FR-012**: System MUST handle Japanese language input and output correctly
- **FR-013**: System MUST prevent users from sending empty messages
- **FR-014**: Chat interface MUST allow scrolling through message history
- **FR-015**: System MUST indicate visually which message is from the user and which is from the AI
- **FR-016**: Users MUST be able to see the itinerary preview alongside the chat (split-screen or tabbed interface)
- **FR-017**: System MUST compress or summarize conversation history when token limits are approached
- **FR-018**: System MUST provide AI prompts that guide the conversation toward itinerary creation
- **FR-019**: System MUST fall back to an alternative AI service if the primary service fails
- **FR-020**: System MUST validate that itinerary data extracted from AI responses is in expected format before displaying

### Assumptions

- Users have stable internet connections for real-time chat
- Average conversation length is 10-30 messages
- Most itineraries will be 1-7 days in length
- Users primarily plan leisure travel, not business travel
- Japanese is the primary language, with potential for English support in the future
- Users access the feature primarily on modern browsers (Chrome, Safari, Firefox, Edge)
- AI service latency is typically under 3 seconds for response initiation
- Users are authenticated (logged in) before using the chat feature

### Key Entities

- **Conversation**: Represents the full chat session between user and AI, containing all messages exchanged and the current context
- **Message**: A single message in the conversation, containing text content, sender (user or AI), timestamp, and optional metadata
- **Itinerary**: The travel plan being created, containing title, destination, date range, daily activities, and budget information
- **Day**: A single day within an itinerary, containing date and list of activities organized by time slot
- **Activity**: A specific item in the itinerary (e.g., visit a location, meal, transit), with name, location, time, duration, cost, and description
- **Chat Context**: Aggregated information from the conversation used to maintain coherence (user preferences, constraints, mentioned locations, etc.)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a basic 3-day itinerary through conversation in under 5 minutes of chat interaction
- **SC-002**: Itinerary preview updates within 1 second of receiving itinerary-related information from AI response
- **SC-003**: 90% of user messages receive AI response initiation (first chunk) within 3 seconds
- **SC-004**: Users can conduct conversations of 20+ messages without noticeable degradation in AI response quality or context retention
- **SC-005**: System successfully falls back to alternative AI service within 5 seconds when primary service fails
- **SC-006**: Chat interface remains responsive and scrollable even with 50+ messages
- **SC-007**: 95% of valid travel-related user requests result in actionable AI suggestions
- **SC-008**: Users can see partial AI responses (streaming) within 1 second of response start
- **SC-009**: Itineraries generated contain at least 3 activities per day for multi-day trips
- **SC-010**: System successfully handles conversation topic switches (new destination) without confusion

### Assumptions for Success Criteria

- "Actionable AI suggestion" means a response that includes specific destinations, activities, or recommendations
- "Without degradation" means AI continues to reference earlier messages and maintain conversation coherence
- "Responsive" means UI interactions (scrolling, typing) respond within 100ms
- "Valid travel-related request" excludes nonsensical input, off-topic questions, and inappropriate content
