# StreamFlix - DevOps Deployment Documentation

## Project Overview

StreamFlix is a microservices-based video streaming application deployed on Amazon EKS using Docker, Jenkins, Amazon ECR, Kubernetes, Helm, MongoDB, Amazon S3 and CloudWatch.

## Architecture

GitHub → Jenkins → Docker → Amazon ECR → Amazon EKS → Helm → Kubernetes

The application contains five microservices: Auth, Streaming, Admin, Chat and Frontend, along with MongoDB.

## AWS Infrastructure

- AWS Region: us-east-1
- EKS Cluster: streamflix-eks
- Worker Nodes: 2
- Container Registry: Amazon ECR
- Object Storage: Amazon S3
- Database Storage: Amazon EBS gp3
- Ingress: NGINX
- Monitoring: Amazon CloudWatch

## Jenkins CI/CD Pipeline

GitHub Repository: https://github.com/aashish579/StreamingApp

Jenkins Job: https://jenkinsacademics.herovired.com/job/Aashish17B-StreamingApp/

The pipeline checks out the source code, builds five Docker images, pushes them to Amazon ECR, deploys the application using Helm and verifies the Kubernetes rollout.

Successful Jenkins Build: #12

Image Tag: ci-12

## Kubernetes and Helm

All five application deployments have two replicas each.

Rolling-update strategy:

- maxSurge: 1
- maxUnavailable: 0

Helm Release: streamflix

Helm Revision: 8

Status: deployed

## MongoDB Persistence

- StatefulSet: mongo
- PVC: mongo-data-mongo-0
- Capacity: 5 GiB
- StorageClass: gp3
- Status: Bound

## CloudWatch Monitoring

CloudWatch Agent, Fluent Bit, Container Insights and CloudWatch Logs are configured.

CPU Alarm: StreamFlix-EKS-High-CPU

Threshold: 80%

Evaluation: Two five-minute periods

Verified Alarm State: OK

## Functional Testing

The following functionality was manually verified:

1. Application homepage
2. Registration and login
3. Video thumbnails
4. Video playback
5. Real-time chat
6. Admin video upload

## Future Improvements

- HTTPS/TLS
- Horizontal Pod Autoscaler
- Dedicated Kubernetes namespaces
- Automated application testing
- Additional monitoring alerts

## Security

AWS credentials, session tokens, JWT secrets and environment files must never be committed to GitHub.
