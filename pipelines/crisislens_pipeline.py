from kfp import dsl


@dsl.component(base_image="python:3.11")
def ingest_data() -> str:
    return "ingested"


@dsl.component(base_image="python:3.11")
def train_model(status: str) -> str:
    return f"model-trained-from-{status}"


@dsl.component(base_image="python:3.11")
def evaluate_model(model_tag: str) -> str:
    return f"evaluation-ok-for-{model_tag}"


@dsl.component(base_image="python:3.11")
def deploy_model(report: str):
    print(report)


@dsl.pipeline(name="crisislens-train-deploy")
def crisislens_pipeline():
    ingest = ingest_data()
    train = train_model(status=ingest.output)
    evaluate = evaluate_model(model_tag=train.output)
    deploy_model(report=evaluate.output)


if __name__ == "__main__":
    from kfp import compiler

    compiler.Compiler().compile(crisislens_pipeline, "crisislens_pipeline.yaml")
