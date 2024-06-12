class VotesPubSub {
    channels = {};

    subscribe(pollId, publishFunc) {
        if(!this.channels[pollId]) {
            this.channels[pollId] = [];
        }

        this.channels[pollId].push(publishFunc);
    }

    publish(pollId, message) {
        if(!this.channels[pollId]) {
            return;
        }

        for(const publishFunc of this.channels[pollId]) {
            publishFunc(message);
        }
    }
}

export const votesPubSub = new VotesPubSub();
