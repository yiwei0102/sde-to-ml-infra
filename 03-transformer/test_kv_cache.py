import unittest
import torch
from mini_gpt import MiniGPT


class TestKVCache(unittest.TestCase):
    def setUp(self):
        torch.manual_seed(42)
        self.model = MiniGPT(vocab_size=30, max_seq_len=32, hidden_size=16, num_heads=4, num_layers=2)
        self.model.eval()
        self.tokens = torch.tensor([[1, 5, 3, 7, 9, 2], [2, 4, 9, 6, 8, 3]])

    @torch.no_grad()
    def test_token_by_token_matches_full_forward(self):
        full_logits = self.model(self.tokens)
        cache = None
        outputs = []
        for i in range(self.tokens.size(1)):
            logits, cache = self.model(self.tokens[:, i:i+1], cache=cache, use_cache=True)
            outputs.append(logits)
        cached_logits = torch.cat(outputs, dim=1)
        torch.testing.assert_close(cached_logits, full_logits, atol=1e-5, rtol=1e-5)
        self.assertEqual(len(cache), 2)
        self.assertEqual(cache[0][0].shape, (2, 4, 6, 4))

    @torch.no_grad()
    def test_prefill_then_decode_matches_full_forward(self):
        full_logits = self.model(self.tokens)
        prefill_logits, cache = self.model(self.tokens[:, :4], use_cache=True)
        next_logits, cache = self.model(self.tokens[:, 4:], cache=cache, use_cache=True)
        combined = torch.cat([prefill_logits, next_logits], dim=1)
        torch.testing.assert_close(combined, full_logits, atol=1e-5, rtol=1e-5)

    def test_training_backward(self):
        self.model.train()
        logits = self.model(self.tokens[:, :-1])
        loss = torch.nn.functional.cross_entropy(logits.reshape(-1, 30), self.tokens[:, 1:].reshape(-1))
        loss.backward()
        self.assertIsNotNone(self.model.blocks[0].attention.Wq.weight.grad)

    def test_max_length(self):
        with self.assertRaises(ValueError):
            self.model(torch.ones(2, 33, dtype=torch.long))


if __name__ == '__main__':
    unittest.main()
