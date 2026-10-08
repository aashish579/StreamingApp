pipeline {
    agent any

    environment {
        IMAGE_TAG = "1.0.${BUILD_NUMBER}"
        DOCKERHUB_USER = "aashish579"
    }

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Verify Tooling') {
    steps {
        sh 'docker --version'
        sh 'kubectl version --client'
        sh 'helm version --short'

        sh 'aws --version'
            }
        }

        stage('Build Docker Images') {
            steps {
                sh 'docker build -t ${DOCKERHUB_USER}/streaming-auth:${IMAGE_TAG} backend/authService'
                sh 'docker build -t ${DOCKERHUB_USER}/streaming-stream:${IMAGE_TAG} -f backend/streamingService/Dockerfile backend'
                sh 'docker build -t ${DOCKERHUB_USER}/streaming-admin:${IMAGE_TAG} -f backend/adminService/Dockerfile backend'
                sh 'docker build -t ${DOCKERHUB_USER}/streaming-chat:${IMAGE_TAG} -f backend/chatService/Dockerfile backend'
                sh '''docker build -t ${DOCKERHUB_USER}/streaming-frontend:${IMAGE_TAG} \\
                  --build-arg REACT_APP_AUTH_API_URL=http://localhost/api \\
                  --build-arg REACT_APP_STREAMING_API_URL=http://localhost/api \\
                  --build-arg REACT_APP_STREAMING_PUBLIC_URL=http://localhost/api/streaming \\
                  --build-arg REACT_APP_ADMIN_API_URL=http://localhost/api/admin \\
                  --build-arg REACT_APP_CHAT_API_URL=http://localhost/api/chat \\
                  --build-arg REACT_APP_CHAT_SOCKET_URL=http://localhost \\
                  frontend'''
            }
        }

        stage('Validate Helm') {
            steps {
                sh 'helm lint streamingapp'
                sh 'helm template streamingapp streamingapp > /tmp/streamingapp-rendered.yaml'
                sh "grep -n '/socket.io' /tmp/streamingapp-rendered.yaml"
            }
        }

        stage('Push Docker Hub Images') {
            when { expression { return env.DOCKERHUB_CREDS_ID?.trim() } }
            steps {
                withCredentials([usernamePassword(credentialsId: env.DOCKERHUB_CREDS_ID, usernameVariable: 'DH_USER', passwordVariable: 'DH_TOKEN')]) {
                    sh 'echo "$DH_TOKEN" | docker login -u "$DH_USER" --password-stdin'
                    sh 'docker push ${DOCKERHUB_USER}/streaming-auth:${IMAGE_TAG}'
                    sh 'docker push ${DOCKERHUB_USER}/streaming-stream:${IMAGE_TAG}'
                    sh 'docker push ${DOCKERHUB_USER}/streaming-admin:${IMAGE_TAG}'
                    sh 'docker push ${DOCKERHUB_USER}/streaming-chat:${IMAGE_TAG}'
                    sh 'docker push ${DOCKERHUB_USER}/streaming-frontend:${IMAGE_TAG}'
                         }
                    }
              }
      

        stage('Verify AWS Authentication') {
            steps {
                withCredentials([
                    [
                        $class: 'AmazonWebServicesCredentialsBinding',
                        credentialsId: 'streamflix-aws-deploy',
                        accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                        secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                    ],
                    string(
                        credentialsId: 'streamflix-aws-session-token',
                        variable: 'AWS_SESSION_TOKEN'
                    )
                ]) {
                    sh '''
                        set +x
                        unset AWS_PROFILE AWS_DEFAULT_PROFILE
                        export AWS_DEFAULT_REGION=us-east-1

                        ACCOUNT=$(aws sts get-caller-identity --query Account --output text)

                        echo "Authenticated AWS account: $ACCOUNT"

                        test "$ACCOUNT" = "710119225605"
                    '''
                }
            }
        }

        stage('Push Images to Amazon ECR') {
            steps {
                withCredentials([
                    [
                        $class: 'AmazonWebServicesCredentialsBinding',
                        credentialsId: 'streamflix-aws-deploy',
                        accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                        secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                    ],
                    string(
                        credentialsId: 'streamflix-aws-session-token',
                        variable: 'AWS_SESSION_TOKEN'
                    )
                ]) {
                    sh '''
                        set +x
                        set -e
                        unset AWS_PROFILE AWS_DEFAULT_PROFILE

                        AWS_REGION=us-east-1
                        AWS_ACCOUNT=710119225605
                        ECR_REGISTRY="$AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com"
                        ECR_TAG="ci-$BUILD_NUMBER"

                        ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
                        test "$ACCOUNT" = "$AWS_ACCOUNT"

                        aws ecr get-login-password --region "$AWS_REGION" |
                            docker login --username AWS --password-stdin "$ECR_REGISTRY"

                        docker tag "$DOCKERHUB_USER/streaming-auth:$IMAGE_TAG" "$ECR_REGISTRY/streamflix-auth:$ECR_TAG"
                        docker tag "$DOCKERHUB_USER/streaming-stream:$IMAGE_TAG" "$ECR_REGISTRY/streamflix-streaming:$ECR_TAG"
                        docker tag "$DOCKERHUB_USER/streaming-admin:$IMAGE_TAG" "$ECR_REGISTRY/streamflix-admin:$ECR_TAG"
                        docker tag "$DOCKERHUB_USER/streaming-chat:$IMAGE_TAG" "$ECR_REGISTRY/streamflix-chat:$ECR_TAG"
                        docker tag "$DOCKERHUB_USER/streaming-frontend:$IMAGE_TAG" "$ECR_REGISTRY/streamflix-frontend:$ECR_TAG"

                        docker push "$ECR_REGISTRY/streamflix-auth:$ECR_TAG"
                        docker push "$ECR_REGISTRY/streamflix-streaming:$ECR_TAG"
                        docker push "$ECR_REGISTRY/streamflix-admin:$ECR_TAG"
                        docker push "$ECR_REGISTRY/streamflix-chat:$ECR_TAG"
                        docker push "$ECR_REGISTRY/streamflix-frontend:$ECR_TAG"

                        echo "All five images pushed to ECR with tag $ECR_TAG"
                    '''
                        }
                    }
               }
                           stage('Verify Amazon EKS Access') {
            steps {
                withCredentials([
                    [
                        $class: 'AmazonWebServicesCredentialsBinding',
                        credentialsId: 'streamflix-aws-deploy',
                        accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                        secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                    ],
                    string(
                        credentialsId: 'streamflix-aws-session-token',
                        variable: 'AWS_SESSION_TOKEN'
                    )
                ]) {
                    sh '''
                        set +x
                        set -eu

                        unset AWS_PROFILE AWS_DEFAULT_PROFILE
                        export AWS_DEFAULT_REGION=us-east-1

                        ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
                        test "$ACCOUNT" = "710119225605"

                        export KUBECONFIG="$WORKSPACE/.kubeconfig-streamflix"
                        trap 'rm -f "$KUBECONFIG"' EXIT

                        aws eks update-kubeconfig \
                          --region us-east-1 \
                          --name streamflix-eks \
                          --kubeconfig "$KUBECONFIG"

                        echo "Checking EKS access:"
                        kubectl get nodes

                        echo "Checking Helm release:"
                        helm status streamflix -n default

                        echo "Checking existing deployments:"
                        kubectl get deployments -n default
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "StreamingApp CI completed successfully: ${IMAGE_TAG}"
        }
        failure {
            echo 'StreamingApp CI failed. Review the stage logs above.'
        }
    }
}
