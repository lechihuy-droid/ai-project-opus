# From Euler to Dormand-Prince: ODE Solvers for Flow Matching Generative Models

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2605.00836
**Published:** 2026-05-05 04:00 UTC
**Topic:** AI

arXiv:2605.00836v1 Announce Type: new 
Abstract: Sampling from Flow Matching generative models requires solving an ordinary differential equation (ODE) whose computational cost is dominated by neural network forward passes. We derive four classical ODE solvers -- Euler, Explicit Midpoint, Classical Runge-Kutta (RK4), and Dormand-Prince 5(4) -- from first principles via Taylor expansion, implement them from scratch in PyTorch, and systematically benchmark their efficiency on Conditional Flow Matching tasks ranging from 2D toy distributions to MNIST digits. On the quantitative side, we use sliced Wasserstein distance to construct NFE-quality Pareto frontiers,finding that RK4 at 80 function evaluations achieves sample quality comparable to Euler at 200. Beyond reproducing known convergence ra
