type Message = { pollOptionId: string, qtVotes: number };
type PublishFunction = (message: Message) => void;

class VotesPubSub {
    private channels: Record<string, PublishFunction[]> = {};

    subscribe(pollId: string, publishFunc: PublishFunction) {
        if(!this.channels[pollId]) {
            this.channels[pollId] = [];
        }

        this.channels[pollId].push(publishFunc);
    }

    publish(pollId: string, message: Message) {
        if(!this.channels[pollId]) {
            return;
        }

        for(const publishFunc of this.channels[pollId]) {
            publishFunc(message);
        }
    }
}

export const votesPubSub = new VotesPubSub();
