exports.handler = async (event) => {
	let message = "hey there!, this lambda function was provisioned using crossplane";
	return {
		status: 200,
		body: message,
	}
}
